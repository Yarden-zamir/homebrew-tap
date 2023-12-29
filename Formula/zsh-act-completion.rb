# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.33.tar.gz"
  sha256 "916ddaecfe2b169ba784542d1d8a06dbd5a5b93c346eaddcee0aa74dc225d655"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
