# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.21.tar.gz"
  sha256 "78cea49e084883827e4e5d4e8556ca4e3504171bab8a88d7bc21402f3c95686a"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
