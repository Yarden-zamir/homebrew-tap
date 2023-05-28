# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.32.tar.gz"
  sha256 "3982cf43430a4a8b7abf9c084c6da91324b078521f2a70c129f2a6c28f6213e7"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
